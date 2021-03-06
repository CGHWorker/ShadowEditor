import { PropertyGrid, PropertyGroup, TextProperty, DisplayProperty, CheckBoxProperty, NumberProperty, IntegerProperty } from '../../../third_party';
import SetGeometryCommand from '../../../command/SetGeometryCommand';

/**
 * 毛刺组件
 * @author tengge / https://github.com/tengge1
 */
class GlitchComponent extends React.Component {
    constructor(props) {
        super(props);

        this.selected = null;

        this.state = {
            show: false,
            expanded: false,
            enabled: false,
            wild: false,
        };

        this.handleExpand = this.handleExpand.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);

        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        const { show, expanded, enabled, wild } = this.state;

        if (!show) {
            return null;
        }

        return <PropertyGroup title={_t('Glitch Effect')} show={show} expanded={expanded} onExpand={this.handleExpand}>
            <CheckBoxProperty label={_t('EnableState')} name={'enabled'} value={enabled} onChange={this.handleChange}></CheckBoxProperty>
            <CheckBoxProperty label={_t('WildMode')} name={'wild'} value={wild} onChange={this.handleChange}></CheckBoxProperty>
        </PropertyGroup>;
    }

    componentDidMount() {
        app.on(`objectSelected.GlitchComponent`, this.handleUpdate);
        app.on(`objectChanged.GlitchComponent`, this.handleUpdate);
    }

    handleExpand(expanded) {
        this.setState({
            expanded,
        });
    }

    handleUpdate() {
        const editor = app.editor;

        if (!editor.selected || editor.selected !== editor.scene) {
            this.setState({
                show: false,
            });
            return;
        }

        this.selected = editor.selected;

        let scene = this.selected;
        let postProcessing = scene.userData.postProcessing || {};

        let state = {
            show: true,
            enabled: postProcessing.glitch ? postProcessing.glitch.enabled : false,
            wild: postProcessing.glitch ? postProcessing.glitch.wild : false,
        };

        this.setState(state);
    }

    handleChange(value, name) {
        if (value === null) {
            this.setState({
                [name]: value,
            });
            return;
        }

        const { enabled, wild } = Object.assign({}, this.state, {
            [name]: value,
        });

        let scene = this.selected;

        scene.userData.postProcessing = scene.userData.postProcessing || {};

        Object.assign(scene.userData.postProcessing, {
            glitch: {
                enabled,
                wild,
            },
        });

        app.call(`objectChanged`, this, this.selected);
        app.call(`postProcessingChanged`, this);
    }
}

export default GlitchComponent;